export const registrationFee = 3950000;
export const mandatoryDeposit = 200000;
export const installmentStartDate = "2027-08-01";
export const installmentStartAt = Date.parse(`${installmentStartDate}T00:00:00+07:00`);

export function annotatePaymentStages(payments) {
  let approvedAmount = 0;
  return [...payments]
    .reverse()
    .map((payment) => {
      const stage = approvedAmount < mandatoryDeposit ? "DP wajib" : "Cicilan";
      if (payment.payment_status === "paid") approvedAmount += Number(payment.amount);
      return { ...payment, stage };
    })
    .reverse();
}
