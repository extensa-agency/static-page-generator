Notes:

[ ] we need to add a 'NEXT_PUBLIC_SITE_URL' when we have one or else the template file routing won't work
[ ] project limit is env var stored in .env.local: NEXT_PUBLIC_PROJECT_LIMIT=2
[ ] env vars need an anthropic api key

**Auth**
[ ] emails aren't validated - reason is because we store info in localStorage about the questionnaire and if user has to click on a validation link in their email, they'll have to fill in their details again. This could be fixed by saving data in url params but will worry about it later

**Optimisation**
[ ] While site is generating, we should add loading states relevant to where the generation is at
[ ] While images are loading in the 'Visual Style' and you navigate away, they stop uploading
[ ] Preview image not displaying correctly on profile page
[ ] Rate limiting

CloudFront Distribution Setup
[X] Create a CloudFront distribution for each user's static site
[X] Configure the distribution to use the S3 bucket as the origin
[X] Set up SSL certificate handling (we'll need this for custom domains)

User Interface for Domain Configuration
[ ] Create a section in your app where users can:
[ ] Enter their domain name
[ ] View the CloudFront distribution URL
[ ] Get DNS configuration instructions

DNS Configuration Instructions
[ ] Provide users with clear instructions to:
[ ] Create a CNAME record pointing to the CloudFront distribution
[ ] Or create an A record with the CloudFront distribution's IP
[ ] Add any necessary subdomain configurations

SSL Certificate Management
[ ] Set up AWS Certificate Manager (ACM) to handle SSL certificates
[ ] Create a system to validate domain ownership
[ ] Associate certificates with CloudFront distributions

Domain Verification System
[ ] Implement a system to verify when users have correctly configured their DNS
[ ] Add status indicators in the UI showing domain configuration progress
[ ] Send notifications when domain is successfully connected

Testing and Validation
[ ] Create tools to verify DNS configuration
[ ] Implement checks to ensure the domain is properly pointing to the CloudFront distribution
[ ] Add monitoring for domain connectivity
