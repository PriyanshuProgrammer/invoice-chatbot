import { GoogleGenAI } from "@google/genai";
import fs from "fs";
const pdf = require("pdf-parse");

let files = fs.readdirSync("./invoices");

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

const question = "What is the total amount due across all invoices?";

const invoiceContent = (content: string) => `
        <Task>Parse the invoice data in form of javascript object as follows and make the answers are accurate, if you think you need some extra information for answer question correctly then tell us that.</Task>
        <format>
            {"vendor":"Amazon","invoice_number":"INV-0012","invoice_date":"2025-08-20","due_date":"2025-09-05","total":2450.00},
        </format>
        <RawInvoiceData>
        ${content}
        </RawInvoiceData>
    `;

const invoiceQuestionContent = (content: string) => `
        <Task>Based on the invoices below answer the following questions in short:</Task>
        <Invoices>
           ${content}
        </Invoices>
        <Question>
            ${question}
        </Question>
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

let parsedInvoices: any[] = [];
async function parseInvoices() {
  await readInvoices();
  console.log("Parsing Invoices...");
  for (let invoiceData of rawInvoicesData) {
    const response = await askAi(invoiceContent(invoiceData));
    parsedInvoices.push(response);
  }
}

async function answerQuestion() {
  await parseInvoices();
  console.log("Answering Question...");
  const response = await askAi(
    invoiceQuestionContent(JSON.stringify(parsedInvoices))
  );
  console.log("Final Answer: ", response);
}

answerQuestion();
