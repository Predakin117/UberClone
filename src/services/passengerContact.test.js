// AI-assisted: see docs/AI_LOG.md #31
import { cleanPhone, passengerContact } from "./passengerContact";

describe("cleanPhone", () => {
  it("keeps the leading + and the digits", () => {
    expect(cleanPhone(" +57 300 000-0000 ")).toBe("+573000000000");
    expect(cleanPhone("(300) 000 0000")).toBe("3000000000");
  });

  it("is empty for anything that is not text", () => {
    expect(cleanPhone(undefined)).toBe("");
    expect(cleanPhone(3000000000)).toBe("");
  });
});

describe("passengerContact", () => {
  it("builds the tel: and sms: links with the passenger's name", () => {
    expect(
      passengerContact({
        passengerName: " Laura Gómez ",
        passengerPhone: "+57 300 000 0000",
      }),
    ).toEqual({
      name: "Laura Gómez",
      callUrl: "tel:+573000000000",
      smsUrl: "sms:+573000000000",
    });
  });

  it("works without a name", () => {
    expect(passengerContact({ passengerPhone: "3000000000" }).name).toBeNull();
  });

  it("is null without a usable phone (the buttons are hidden)", () => {
    expect(passengerContact({ passengerName: "Laura" })).toBeNull();
    expect(passengerContact({ passengerPhone: "123" })).toBeNull();
    expect(passengerContact(null)).toBeNull();
  });
});
