import { describe, it, expect } from "vitest";
import { buildConfirmationEmail, buildCancellationEmail, buildReminderEmail } from "../notifications";

describe("buildConfirmationEmail", () => {
  it("should build email for single service", () => {
    const email = buildConfirmationEmail({
      clientName: "Maria",
      services: [{ name: "Design de Sobrancelha", price: 80, duration_minutes: 40 }],
      date: "15 de marco de 2025",
      time: "10:00",
      appointmentId: "test-id",
    });

    expect(email.subject).toContain("Design de Sobrancelha");
    expect(email.html).toContain("Maria");
    expect(email.html).toContain("15 de marco de 2025");
    expect(email.html).toContain("10:00");
    expect(email.to).toBe(""); // Set by caller
  });

  it("should build email for multiple services", () => {
    const email = buildConfirmationEmail({
      clientName: "Joana",
      services: [
        { name: "Manicure", price: 50, duration_minutes: 30 },
        { name: "Pedicure", price: 60, duration_minutes: 40 },
      ],
      date: "20 de marco de 2025",
      time: "14:00",
      appointmentId: "test-id-2",
    });

    expect(email.subject).toContain("Manicure");
    expect(email.subject).toContain("Pedicure");
    expect(email.html).toContain("Joana");
  });

  it("should escape HTML in client name", () => {
    const email = buildConfirmationEmail({
      clientName: '<script>alert("xss")</script>',
      services: [{ name: "Test", price: 50, duration_minutes: 30 }],
      date: "test date",
      time: "10:00",
      appointmentId: "id",
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("should escape HTML in service names", () => {
    const email = buildConfirmationEmail({
      clientName: "Maria",
      services: [{ name: '<img onerror="alert(1)">', price: 50, duration_minutes: 30 }],
      date: "test date",
      time: "10:00",
      appointmentId: "id",
    });

    expect(email.html).not.toContain('<img onerror');
    expect(email.html).toContain("&lt;img");
  });
});

describe("buildCancellationEmail", () => {
  it("should build cancellation email", () => {
    const email = buildCancellationEmail({
      clientName: "Maria",
      services: [{ name: "Design", price: 80, duration_minutes: 40 }],
      date: "15 de marco",
      time: "10:00",
    });

    expect(email.subject).toContain("Cancelado");
    expect(email.html).toContain("cancelado");
    expect(email.html).toContain("Maria");
  });
});

describe("buildReminderEmail", () => {
  it("should build 24h reminder", () => {
    const email = buildReminderEmail({
      clientName: "Maria",
      serviceNames: "Design de Sobrancelha",
      date: "15 de marco",
      time: "10:00",
      type: "24h",
    });

    expect(email.subject).toContain("Lembrete");
    expect(email.html).toContain("amanha");
  });

  it("should build 2h reminder", () => {
    const email = buildReminderEmail({
      clientName: "Maria",
      serviceNames: "Design de Sobrancelha",
      date: "15 de marco",
      time: "10:00",
      type: "2h",
    });

    expect(email.html).toContain("em 2 horas");
  });
});
