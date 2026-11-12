// AI-assisted: see docs/AI_LOG.md #30
import {
  averageRating,
  expiryStatus,
  profileUpdate,
  profileValues,
} from "./driverProfile";

const TODAY = new Date(2026, 10, 12, 15, 30);

describe("averageRating", () => {
  it("averages the ratings with one decimal", () => {
    expect(averageRating([{ rating: 5 }, { rating: 4 }, { rating: 4 }])).toEqual(
      { average: 4.3, count: 3 },
    );
  });

  it("ignores trips without a valid rating", () => {
    expect(
      averageRating([{ rating: 5 }, { rating: null }, {}, { rating: 9 }]),
    ).toEqual({ average: 5, count: 1 });
  });

  it("is null without ratings", () => {
    expect(averageRating([])).toEqual({ average: null, count: 0 });
  });
});

describe("expiryStatus", () => {
  it("is expired before today", () => {
    expect(expiryStatus("2026-11-11", TODAY)).toEqual({
      state: "expired",
      daysLeft: -1,
    });
  });

  it("warns on the expiry day and up to 29 days before", () => {
    expect(expiryStatus("2026-11-12", TODAY)).toEqual({
      state: "soon",
      daysLeft: 0,
    });
    expect(expiryStatus("2026-12-11", TODAY)).toEqual({
      state: "soon",
      daysLeft: 29,
    });
  });

  it("is ok from 30 days on", () => {
    expect(expiryStatus("2026-12-12", TODAY)).toEqual({
      state: "ok",
      daysLeft: 30,
    });
  });

  it("is unknown without a valid date", () => {
    expect(expiryStatus(undefined, TODAY).state).toBe("unknown");
    expect(expiryStatus("2026-02-30", TODAY).state).toBe("unknown");
  });
});

describe("profileUpdate", () => {
  const driver = {
    status: "approved",
    personal: { name: "Tamiro Solano", profilePhotoUrl: "https://a/1.jpg" },
    documents: { mercadoPagoEmail: "pagos@ejemplo.com" },
  };

  it("reads the editable values of the driver", () => {
    expect(profileValues(driver)).toEqual({
      profilePhoto: "https://a/1.jpg",
      name: "Tamiro Solano",
      mercadoPagoEmail: "pagos@ejemplo.com",
    });
    expect(profileValues(null)).toEqual({
      profilePhoto: "",
      name: "",
      mercadoPagoEmail: "",
    });
  });

  it("is empty when nothing changed, after cleaning spaces and case", () => {
    expect(
      profileUpdate(driver, {
        profilePhoto: "https://a/1.jpg",
        name: "  Tamiro   Solano ",
        mercadoPagoEmail: " PAGOS@ejemplo.com ",
      }),
    ).toEqual({});
  });

  it("only has the changed fields, with dotted paths and no status", () => {
    const update = profileUpdate(driver, {
      profilePhoto: "https://a/2.jpg",
      name: "Tamiro José Solano",
      mercadoPagoEmail: "pagos@ejemplo.com",
    });
    expect(update).toEqual({
      "personal.profilePhotoUrl": "https://a/2.jpg",
      "personal.name": "Tamiro José Solano",
    });
    expect(update).not.toHaveProperty("status");
  });
});
