"use client";

import { supabase } from "@/lib/supabase/client/supabase";
import { useQuery } from "@tanstack/react-query";
export type Website = {
  id: string;
  name: string;
  hosting_status: string;
  preview_url: string;
  project_url: string;
  cloudfront_domain?: string;
  site_id: string;
  updated_at: string;
  domain_setups: {
    domain_name: string;
    certificate_arn: string;
    distribution_domain: string;
    dns_setup_option: string;
    nameservers: string[];
    completed: boolean;
  }[];
};
export function useWebsites(userId: string) {
  return useQuery({
    queryKey: ["websites", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("websites")
        .select(
          `
          *,
          domain_setups!left (
            domain_name,
            certificate_arn,
            distribution_domain,
            dns_setup_option,
            nameservers,
            validation_records,
            created_at,
            updated_at,
            completed
          )
        `
        )
        .eq("user_id", userId);
      return data as Website[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
