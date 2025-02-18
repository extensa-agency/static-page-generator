import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

type ImageWithMetadata = {
  url: string;
  description: string;
  metadata: {
    width: number;
    height: number;
    aspectRatio: number;
  };
};

type BusinessInfo = {
  name: string;
  description: string;
  offerings: string[];
  location: string;
  images: ImageWithMetadata[];
  design_preferences: {
    style?: string;
    color_palette?: string;
  };
  contact_preferences: {
    type: 'form' | 'email' | 'phone' | 'subscribe' | '';
    business_hours: string;
    contact_email: string;
    contact_phone: string;
  };
  branding: {
    logo_url?: string;
    logo_metadata?: {
      width: number;
      height: number;
      aspectRatio: number;
    };
    tagline?: string;
  };
}

export class LandingPageGenerator {
  private llm: ChatOpenAI;
  private template: ChatPromptTemplate;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: "o1",
      temperature: 1,
    });

    this.template = ChatPromptTemplate.fromTemplate(`
      Create a modern, responsive HTML landing page for this business:
      Business Name: {name}
      Description: {description}
      Offerings: {offerings}
      Location: {location}
      Images: {images}
      Color Palette: {colorPalette}
      Style Preferences: {style}
      Contact Method: {contactType}
      Business Hours: {businessHours}
      Logo URL: {logoUrl}
      Tagline: {tagline}
      
      Requirements:
      1. Use modern HTML5 and Tailwind CSS
      2. Make it responsive and mobile-first
      3. Include proper meta tags and Tailwind CDN
      4. Implement the specified contact method ({contactType})
      5. Use the specified color palette for styling
      
      The HTML must start with proper DOCTYPE and include all necessary meta tags.
        Example structure:
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ... (rest of head content) ...
        </head>
        <body>
            ... (page content) ...
        </body>
        </html>

        Return only the complete HTML code, no explanations.
    `);
  }

  async generate(businessInfo: BusinessInfo): Promise<string> {
    console.log('Generating site with assets:', {
      images: businessInfo.images,
      logo: businessInfo.branding.logo_url
    });

    const messages = await this.template.formatMessages({
      name: businessInfo.name || "",
      description: businessInfo.description || "",
      offerings: businessInfo.offerings.join("\n"),
      location: businessInfo.location,
      images: businessInfo.images
        .filter(img => img.url)
        .map(img => `${img.url} - ${img.description} (${img.metadata.width}x${img.metadata.height}, aspect ratio: ${img.metadata.aspectRatio})`)
        .join("\n"),
      colorPalette: businessInfo.design_preferences.color_palette || "default",
      style: businessInfo.design_preferences.style || "modern and professional",
      contactType: businessInfo.contact_preferences.type || "form",
      businessHours: businessInfo.contact_preferences.business_hours,
      logoUrl: businessInfo.branding.logo_url || "",
      tagline: businessInfo.branding.tagline || ""
    });

    console.log('Formatted template with image URLs:', {
      images: businessInfo.images
        .filter(img => img.url)
        .map(img => `${img.url} - ${img.description} (${img.metadata.width}x${img.metadata.height}, aspect ratio: ${img.metadata.aspectRatio})`)
        .join("\n"),
      logoUrl: businessInfo.branding.logo_url || ""
    });

    const response = await this.llm.invoke(messages);
    return response.content.toString();
  }
} 