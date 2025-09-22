import { GoogleGenAI, Type, type FunctionDeclaration } from "@google/genai";
import fs from "fs";
import sql from "sql.js";
import Fuse from "fuse.js";

const pdf = require("pdf-parse");

type TInvoices = {
  vendor: string;
  customer: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total: string;
};

const files = fs.readdirSync("./invoices");
// create a simple inmemory database
const SQL = await sql();
const db = new SQL.Database();

// create a invoice table
db.run(
  "CREATE TABLE invoice (vendor TEXT, customer TEXT, invoice_number TEXT,invoice_date TEXT,due_date TEXT,total REAL);"
);

// Initialize the GoogleGenAI client with your API key
const ai = new GoogleGenAI({
  apiKey: "AIzaSyD55ISrrVFy1xS09jAzST_LFVE0zVmafhQ",
});

function fuzzyMatch(input: string, choices: string[]): string | null {
  const fuse = new Fuse(choices, { threshold: 0.4 });
  const result = fuse.search(input);
  //@ts-ignore
  return result.length > 0 ? result[0].item : null;
}

function getUniqueVendorsAndCustomers() {
  const vendors = db
    .exec("SELECT DISTINCT vendor FROM invoice")[0]
    ?.values.map((v) => v[0]?.toString());
  const customers = db
    .exec("SELECT DISTINCT customer FROM invoice")[0]
    ?.values.map((c) => c[0]?.toString());
  return { vendors, customers };
}

function getInvoiceSum({
  customer,
  vendor,
}: {
  customer: string;
  vendor: string;
}) {
  const obj = getUniqueVendorsAndCustomers();
  //@ts-ignore
  const parsedCustomer = fuzzyMatch(customer, obj.customers);
  //@ts-ignore
  const parsedVendor = fuzzyMatch(vendor, obj.vendors);
  const dbResponse = db.exec(
    `SELECT SUM(total) as total_due FROM invoice WHERE customer = '${parsedCustomer}' AND vendor = '${parsedVendor}'`
  );
  //@ts-ignore
  return dbResponse[0]?.values[0][0];
}

// tools to be used by ai
const getInvoiceSumFunctionDeclaration: FunctionDeclaration = {
  name: "getInvoiceSum",
  description: "Get the sum of invoices for a specific customer owing a vendor",
  parameters: {
    type: Type.OBJECT,
    properties: {
      customer: {
        type: Type.STRING,
        description: "The company that owes money (invoice receiver)",
      },
      vendor: {
        type: Type.STRING,
        description: "The company that issued the invoice (invoice sender)",
      },
    },
    required: ["customer", "vendor"],
  },
};

const question = "How much test business owes demo";

const invoiceContent = (content: string) => `
        <Task>Parse the invoice data in form of javascript object as follows.</Task>
        <format>
            {"vendor":"Amazon","customer":"Microsoft","invoice_number":"INV-0012","invoice_date":"2025-08-20","due_date":"2025-09-05","total":2450.00},
        </format>
        <RawInvoiceData>
        ${content}
        </RawInvoiceData>
    `;

const questionContent = (question: string) => `
      <schema>
        Table: "invoice",
      Columns: {
        vendor: string;
        customer: string;
        invoice_number: string;
        invoice_date: string;
        due_date: string;
        total: number;
      }</schema>
      <question>${question}</question>
`;

let rawInvoicesData: string[] = [];
async function readInvoices() {
  for (const file of files) {
    try {
      let dataBuffer = fs.readFileSync(`./invoices/${file}`);
      let data = await pdf(dataBuffer);
      rawInvoicesData.push(data.text);
    } catch (_) {
      console.error("File does not exist");
    }
  }
}

async function parseInvoices() {
  await readInvoices();
  console.log("Parsing Invoices...");
  for (let invoiceData of rawInvoicesData) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: invoiceContent(invoiceData),
    });
    let trimResponse = response.text
      ?.trim()
      .replaceAll("```", "")
      .replace("json", "");
    let data: TInvoices = JSON.parse(trimResponse as string);
    db.run("INSERT INTO invoice VALUES (?, ?, ?, ?, ?, ?)", [
      data.vendor,
      data.customer,
      data.invoice_number,
      data.invoice_date,
      data.due_date,
      data.total,
    ]);
  }
}

async function answerQuestion() {
  await parseInvoices();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: questionContent(question),
    config: {
      tools: [
        {
          functionDeclarations: [getInvoiceSumFunctionDeclaration],
        },
      ],
    },
  });
  if (response.functionCalls && response.functionCalls.length > 0) {
    const functionalCall = response.functionCalls[0];
    switch (functionalCall?.name) {
      case "getInvoiceSum": {
        //@ts-ignore
        const res = getInvoiceSum({customer: functionalCall.args.customer,vendor: functionalCall.args.vendor,
        });
        if (res) {
          console.log(res);
        } else {
          console.log("columns does not exist in database");
        }
      }
      default: {
      }
    }
  } else {
    let trimResponse = response.text
      ?.trim()
      .replaceAll("```", "")
      .replace("sql", "");
    let dbResponse = db.exec(trimResponse as string);
    //@ts-ignore
    console.log("Response: ", dbResponse[0]?.values[0][0]);
  }
}

answerQuestion();
