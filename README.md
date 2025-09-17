# Invoice Chatbot

This project is an AI-powered agent that extracts and analyzes invoice data from PDF files using Google Gemini and answers questions about the invoices.

## Demo video
[▶ Watch the video](https://github-production-user-asset-6210df.s3.amazonaws.com/68071219/490365013-0b19b2c9-6292-4225-81d7-f23ff0382008.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20250917%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250917T051848Z&X-Amz-Expires=300&X-Amz-Signature=7e3fe0d1cb6d8ee357be06b1cd8012e54a8984f08db9187ab3172cc09d63afe0&X-Amz-SignedHeaders=host)

## Features
- Reads all PDF invoices from the `invoices/` directory
- Extracts invoice data using Google Gemini AI
- Put all the data in the sql in-memory database
- Ask sql queries from AI to run and get answer for the question from db.

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
