# Invoice Chatbot

This project is an AI-powered agent that extracts and analyzes invoice data from PDF files using Google Gemini and answers questions about the invoices.

## Demo
[Demo](https://github-production-user-asset-6210df.s3.amazonaws.com/68071219/492140237-f5d6f668-7a31-48e8-aadf-9107f259b4e0.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20250922%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250922T051231Z&X-Amz-Expires=300&X-Amz-Signature=13bddb37033ff4693bc00e9ee0463fa0c2e4f253df427ca56a78e023fe4a024a&X-Amz-SignedHeaders=host)

## Features
- Reads all PDF invoices from the `invoices/` directory
- Extracts invoice data using Google Gemini AI
- Put all the data in the sql in-memory database
- Built tools for ai to run sql queries and to solve some complex query problems.
- Used fuse.js to get to closest data from db, because user might mispelled the prompt.

## Prerequisites
- Node.js (v18 or higher recommended)
- bun
- A Google Gemini API key

## Install bun
 ```bash
    npm install -g bun    
```

## Setup
1. **Install dependencies:**
	```bash
	bun install
	```

2. **Add your invoices:**
	- Place your PDF invoice files in the `invoices/` directory.

3. **Set your Google Gemini API key:**
	- Open `index.ts` and set your API key in the `apiKey` field:
	  ```ts
	  const ai = new GoogleGenAI({
		 apiKey: "YOUR_API_KEY_HERE",
	  });
	  ```

## Running the Agent
To run the agent and get answers about your invoices:

```bash
bun index.ts
```

The agent will:
- Parse all invoices in the `invoices/` folder
- Extract relevant data using AI
- Answer the default question (e.g., total amount due)

## Customizing the Question
Edit the `question` variable in `index.ts` to ask a different question about your invoices.

## Notes
- Make sure your API key has access to the Gemini model.
- The agent expects invoices in PDF format.

## License
MIT
