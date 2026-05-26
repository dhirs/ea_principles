# S3 JSON Viewer

A modern web application to display JSON data from AWS S3 buckets with a beautiful, responsive UI.

## Features

- 🎨 Modern UI with Tailwind CSS and Shadcn/UI
- 📱 Fully responsive design
- 🔄 Dynamic content rendering (tabs, accordions, grids, lists)
- ⚡ Server-side data fetching from S3
- 🔒 Secure AWS credentials handling
- 🚀 Optimized for Vercel deployment

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env.local`:
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_region
   S3_BUCKET_NAME=your_bucket
   S3_JSON_KEY=path/to/file.json
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deploy on Vercel

1. Push your code to GitHub

2. Import your repository on [Vercel](https://vercel.com/new)

3. Add environment variables in Vercel dashboard:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `S3_BUCKET_NAME`
   - `S3_JSON_KEY`

4. Deploy! The app will be live at your Vercel URL

## JSON Structure

The app expects JSON data with this structure:

```json
{
  "title": "Page Title",
  "description": "Optional description",
  "sections": [
    {
      "id": "section1",
      "title": "Section Title",
      "description": "Optional section description",
      "type": "accordion|grid|list|text",
      "content": [...]
    }
  ]
}
```

## Security Notes

- Never commit `.env.local` or any file containing AWS credentials
- Use environment variables for all sensitive data
- Consider using AWS IAM roles with minimal permissions
