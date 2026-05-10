"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { FilterDraft, DEFAULT } from "../types";

export function useUrlSync() {
  const searchParams = useSearchParams();

  const getInitialState = useCallback((): { draft: FilterDraft; hideLinkedPRs: boolean } => {
    if (!searchParams) return { draft: DEFAULT, hideLinkedPRs: false };
    
    const fromUrl: FilterDraft = { ...DEFAULT };
    if (searchParams.has("text")) fromUrl.text = searchParams.get("text")!;
    if (searchParams.has("languages")) fromUrl.languages = searchParams.get("languages")!.split(",");
    if (searchParams.has("labels")) fromUrl.labels = searchParams.get("labels")!.split(",");
    if (searchParams.has("zeroComments")) fromUrl.zeroComments = searchParams.get("zeroComments") === "true";
    if (searchParams.has("noAssignee")) fromUrl.noAssignee = searchParams.get("noAssignee") === "true";
    if (searchParams.has("discussions")) fromUrl.contributionType = "discussion";
    if (searchParams.has("age")) {
      const parsedAge = Number(searchParams.get("age"));
      fromUrl.issueAgeDays = Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : DEFAULT.issueAgeDays;
    }
    if (searchParams.has("minStars")) {
      const parsedMinStars = Number(searchParams.get("minStars"));
      fromUrl.minStars = Number.isFinite(parsedMinStars) && parsedMinStars >= 0 ? parsedMinStars : 0;
    }
    if (searchParams.has("maxStars")) {
      const val = searchParams.get("maxStars");
      const parsedMaxStars = val === null || val === "" ? null : Number(val);
      fromUrl.maxStars = parsedMaxStars !== null && Number.isFinite(parsedMaxStars) && parsedMaxStars >= 0 ? parsedMaxStars : null;
    }
    if (searchParams.has("minForks")) {
      const parsedMinForks = Number(searchParams.get("minForks"));
      fromUrl.minForks = Number.isFinite(parsedMinForks) && parsedMinForks >= 0 ? parsedMinForks : 0;
    }
    if (searchParams.has("maxForks")) {
      const val = searchParams.get("maxForks");
      const parsedMaxForks = val === null || val === "" ? null : Number(val);
      fromUrl.maxForks = parsedMaxForks !== null && Number.isFinite(parsedMaxForks) && parsedMaxForks >= 0 ? parsedMaxForks : null;
    }
    if (searchParams.has("pushed")) {
      const parsedPushed = Number(searchParams.get("pushed"));
      fromUrl.repoPushedDays = Number.isFinite(parsedPushed) && parsedPushed > 0 ? parsedPushed : DEFAULT.repoPushedDays;
    }
    if (searchParams.has("org")) fromUrl.org = searchParams.get("org")!;
    if (searchParams.has("onlyOrgs")) fromUrl.onlyOrgs = searchParams.get("onlyOrgs") === "true";
    if (searchParams.has("active")) fromUrl.activeMaintainer = searchParams.get("active") === "true";
    if (searchParams.has("pairing")) fromUrl.pairingRequested = searchParams.get("pairing") === "true";
    
    return {
      draft: fromUrl,
      hideLinkedPRs: searchParams.has("hideLinkedPRs") ? searchParams.get("hideLinkedPRs") === "true" : false
    };
  }, [searchParams]);

  const syncUrlFromDraft = useCallback((d: FilterDraft, hidePRs: boolean) => {
    const params = new URLSearchParams();
    if (d.text) params.set("text", d.text);
    if (d.languages.length) params.set("languages", d.languages.join(","));
    if (d.labels.length) params.set("labels", d.labels.join(","));
    if (d.zeroComments) params.set("zeroComments", "true");
    if (d.noAssignee) params.set("noAssignee", "true");
    if (d.contributionType === "discussion") params.set("discussions", "true");
    if (hidePRs) params.set("hideLinkedPRs", "true");
    if (d.issueAgeDays !== DEFAULT.issueAgeDays) params.set("age", String(d.issueAgeDays));
    if (d.minStars > 0) params.set("minStars", String(d.minStars));
    if (d.maxStars !== null) params.set("maxStars", String(d.maxStars));
    if (d.minForks > 0) params.set("minForks", String(d.minForks));
    if (d.maxForks !== null) params.set("maxForks", String(d.maxForks));
    if (d.repoPushedDays !== DEFAULT.repoPushedDays) params.set("pushed", String(d.repoPushedDays));
    if (d.org) params.set("org", d.org);
    if (d.onlyOrgs) params.set("onlyOrgs", "true");
    if (d.activeMaintainer) params.set("active", "true");
    if (d.pairingRequested) params.set("pairing", "true");

    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
  }, []);

  return { getInitialState, syncUrlFromDraft };
}
