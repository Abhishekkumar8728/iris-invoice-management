import Sequence from "../models/sequence.model.js";

const generateInvoiceNumber =
  async () => {
    const year =
      new Date().getFullYear();

    const key =
      `invoice-${year}`;

    const sequence =
      await Sequence.findOneAndUpdate(
        { key },

        {
          $inc: {
            sequence: 1
          }
        },

        {
          returnDocument: "after",
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

    return `INV-${year}-${String(
      sequence.sequence
    ).padStart(6, "0")}`;
  };

export default generateInvoiceNumber;