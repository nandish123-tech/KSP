# KSP API Engine - AppSail Deployment

This project is configured for deployment on Zoho Catalyst AppSail.

## Deployment Steps

1. Install and login to Catalyst CLI:
   `npm install -g zcatalyst-cli`
   `catalyst login`

2. Select the correct Catalyst project:
   `catalyst project:use` (Select your KSP project)

3. Navigate to the AppSail folder:
   `cd appsail`

4. Install Python dependencies locally:
   `pip install -r requirements.txt`

5. Test locally:
   `python run.py`

6. Verify the backend is running:
   `http://localhost:8085/api/health`

7. Build the React frontend:
   `cd ../frontend && npm run build`
   Copy the `dist` folder to `appsail/frontend/dist`

8. Deploy using the Catalyst CLI:
   `catalyst deploy --only appsail`

9. Find the AppSail URL in the output, and test it:
   `https://YOUR_APPSAIL_DOMAIN/api/health`

10. Configure your frontend (if deployed separately) with:
    `VITE_API_URL=https://YOUR_APPSAIL_DOMAIN`
