import { afterEach, describe, it, expect, vi } from "vitest";
import {
  AccountsResource,
  CustomersResource,
  DisputesResource,
  EventsResource,
  InvoicesResource,
  RefundsResource,
  ShieldResource,
  TaxResource,
  WebhookEndpointsResource,
} from "./resources/index.js";
import { PaymentsResource } from "./resources/payments.js";
import type { BaseClient } from "./http.js";

// The API reads an encoded "/" in a path as a separator, so an id holding one
// reached another route: payments.retrieve("pay_1/refunds") listed refunds and
// customers.delete("cus_1/tax_ids/txi_1") deleted a tax id. An empty id, "." or
// ".." reached another route too, as URLs resolve dot segments. No Wajub id takes
// these forms: every method that puts an id in a path refuses one before sending.
type Call = [string, (id: string) => Promise<unknown>, BaseClient];

function calls(): Call[] {
  const args = ["sk_test.key", "https://api.wajub.test"] as const;
  const payments = new PaymentsResource(...args);
  const customers = new CustomersResource(...args);
  const disputes = new DisputesResource(...args);
  const tax = new TaxResource(...args);
  const shield = new ShieldResource(...args);
  const invoices = new InvoicesResource(...args);
  const events = new EventsResource(...args);
  const accounts = new AccountsResource(...args);
  const webhooks = new WebhookEndpointsResource(...args);
  const refunds = new RefundsResource(...args);
  return [
    ["payments.retrieve", (id) => payments.retrieve(id), payments],
    ["payments.cancel", (id) => payments.cancel(id), payments],
    ["payments.process", (id) => payments.process(id, {}), payments],
    ["payments.processSplit", (id) => payments.processSplit(id, {}), payments],
    ["payments.listRefunds", (id) => payments.listRefunds(id), payments],
    ["customers.retrieve", (id) => customers.retrieve(id), customers],
    ["customers.update", (id) => customers.update(id, {}), customers],
    ["customers.delete", (id) => customers.delete(id), customers],
    ["customers.block", (id) => customers.block(id), customers],
    ["customers.unblock", (id) => customers.unblock(id), customers],
    ["customers.activate", (id) => customers.activate(id), customers],
    ["customers.deactivate", (id) => customers.deactivate(id), customers],
    ["customers.listTaxIds", (id) => customers.listTaxIds(id), customers],
    ["customers.createTaxId", (id) => customers.createTaxId(id, {}), customers],
    ["customers.deleteTaxId (customer)", (id) => customers.deleteTaxId(id, "txi_1"), customers],
    ["customers.deleteTaxId (tax id)", (id) => customers.deleteTaxId("cus_1", id), customers],
    ["disputes.retrieve", (id) => disputes.retrieve(id), disputes],
    ["disputes.submitEvidence", (id) => disputes.submitEvidence(id, {}), disputes],
    ["disputes.accept", (id) => disputes.accept(id), disputes],
    ["disputes.close", (id) => disputes.close(id), disputes],
    ["disputes.sendMessage", (id) => disputes.sendMessage(id, {}), disputes],
    ["tax.retrieveCode", (id) => tax.retrieveCode(id), tax],
    ["tax.retrieveRegistration", (id) => tax.retrieveRegistration(id), tax],
    ["tax.updateRegistration", (id) => tax.updateRegistration(id, {}), tax],
    ["tax.deleteRegistration", (id) => tax.deleteRegistration(id), tax],
    ["shield.removeFromBlocklist", (id) => shield.removeFromBlocklist(id), shield],
    ["invoices.send", (id) => invoices.send(id), invoices],
    ["invoices.markPaid", (id) => invoices.markPaid(id), invoices],
    ["invoices.cancel", (id) => invoices.cancel(id), invoices],
    ["events.retrieve", (id) => events.retrieve(id), events],
    ["events.resend", (id) => events.resend(id), events],
    ["accounts.regenerateToken", (id) => accounts.regenerateToken(id), accounts],
    ["webhookEndpoints.rotateSecret", (id) => webhooks.rotateSecret(id), webhooks],
    ["refunds.retrieve", (id) => refunds.retrieve(id), refunds],
  ];
}

describe("ids in request paths", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(calls())("%s refuses an id that would reach another route, before sending anything", async (_name, call, client) => {
    const request = vi.spyOn(client, "request").mockResolvedValue({});

    for (const id of ["pay_1/refunds", "cus_1/tax_ids/txi_1", "/", "", ".", ".."]) {
      await expect(call(id), JSON.stringify(id)).rejects.toThrow(TypeError);
      await expect(call(id), JSON.stringify(id)).rejects.toThrow(/is not a Wajub id/);
    }
    expect(request).not.toHaveBeenCalled();
  });

  it.each(calls())("%s still sends any other id, encoded", async (_name, call, client) => {
    const request = vi.spyOn(client, "request").mockResolvedValue({});

    await call("a b?c");
    await call("trx.1..2");

    expect(request).toHaveBeenCalledTimes(2);
    expect(String(request.mock.calls[0]?.[1])).toContain("a%20b%3Fc");
    expect(String(request.mock.calls[1]?.[1])).toContain("trx.1..2");
  });
});
