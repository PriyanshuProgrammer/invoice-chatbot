import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import sql from "sql.js";
const pdf = require("pdf-parse");

type TInvoices = {
  vendor: string;
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
  "CREATE TABLE invoice (vendor TEXT, invoice_number TEXT,invoice_date TEXT,due_date TEXT,total REAL);"
);

// Initialize the GoogleGenAI client with your API key
const ai = new GoogleGenAI({
  apiKey: "",
});

async function askAi(content: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: content,
  });
  return response.text;
}

const question = "What is sum of total due on invoices?";

const invoiceContent = (content: string) => `
        <Task>Parse the invoice data in form of javascript object as follows.</Task>
        <format>
            {"vendor":"Amazon","invoice_number":"INV-0012","invoice_date":"2025-08-20","due_date":"2025-09-05","total":2450.00},
        </format>
        <RawInvoiceData>
        ${content}
        </RawInvoiceData>
    `;

const questionContent = (question: string) => `
      <Task>We have created a database with following schema. Now you need to write sql queries to find the answer for the question below. Make sure to only return sql query for sql.js library.</Task>
      <schema>
        Table: "invoice",
      Columns: {
        vendor: string;
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
    const response = await askAi(invoiceContent(invoiceData));
    let trimResponse = response
      ?.trim()
      .replaceAll("```", "")
      .replace("json", "");
    let data: TInvoices = JSON.parse(trimResponse as string);
    db.run("INSERT INTO invoice VALUES (?, ?, ?, ?, ?)", [
      data.vendor,
      data.invoice_number,
      data.invoice_date,
      data.due_date,
      data.total,
    ]);
  }
}

async function answerQuestion() {
  await parseInvoices();
  let response = await askAi(questionContent(question));
  let trimResponse = response?.trim().replaceAll("```", "").replace("sql", "");
  let dbResponse = db.exec(trimResponse as string);
  //@ts-ignore
  console.log("Response: ", dbResponse[0]?.values[0][0]);
}

answerQuestion();
