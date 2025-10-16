import type {
  GrantsGovOpportunity,
  GrantsGovSearchRequest,
  GrantsGovSearchResponse
} from "./types";

const BASE_URL = "https://api.grants.gov/v1/api";
const STAGING_URL = "https://api.staging.grants.gov/v1/api";

export class GrantsGovClient {
  private readonly baseUrl: string;
  private readonly retryAttempts = 3;
  private readonly retryDelay = 1000;

  constructor(useStaging = false) {
    this.baseUrl = useStaging ? STAGING_URL : BASE_URL;
  }

  async search(params: GrantsGovSearchRequest, fetchAll = false): Promise<GrantsGovSearchResponse> {
    const url = `${this.baseUrl}/search2`;

    const requestBody: GrantsGovSearchRequest = {
      oppStatuses: "forecasted|posted",
      rows: 100,
      startRecordNum: 0,
      ...params
    };

    const response = await this.fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Grants.gov API error: ${response.status} ${response.statusText}`);
    }

    const data: GrantsGovSearchResponse = await response.json();

    if (data.errorcode !== 0) {
      throw new Error(`Grants.gov API error: ${data.msg}`);
    }

    if (fetchAll && data.data.hitCount > data.data.oppHits.length) {
      const allResults = [...data.data.oppHits];
      let currentStart = (requestBody.startRecordNum ?? 0) + (requestBody.rows ?? 100);

      while (currentStart < data.data.hitCount) {
        const nextPage = await this.search(
          {
            ...params,
            startRecordNum: currentStart
          },
          false
        );

        allResults.push(...nextPage.data.oppHits);
        currentStart += requestBody.rows ?? 100;

        await this.delay(500);
      }

      data.data.oppHits = allResults;
    }

    return data;
  }

  async fetchOpportunity(opportunityId: string): Promise<GrantsGovOpportunity> {
    const url = `${this.baseUrl}/fetchOpportunity`;

    const response = await this.fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId })
    });

    if (!response.ok) {
      throw new Error(`Grants.gov API error: ${response.status} ${response.statusText}`);
    }

    const data: { errorcode: number; msg: string; data: GrantsGovOpportunity } = await response.json();

    if (data.errorcode !== 0) {
      throw new Error(`Grants.gov API error: ${data.msg}`);
    }

    return data.data;
  }

  private async fetchWithRetry(url: string, options: RequestInit, attempt = 1): Promise<Response> {
    try {
      const response = await fetch(url, options);

      if ((response.status === 429 || response.status >= 500) && attempt <= this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.warn(
          `Grants.gov API ${response.status}, retrying in ${delay}ms (attempt ${attempt}/${this.retryAttempts})`
        );
        await this.delay(delay);
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      return response;
    } catch (error) {
      if (attempt <= this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.warn(
          `Grants.gov API error, retrying in ${delay}ms (attempt ${attempt}/${this.retryAttempts})`
        );
        await this.delay(delay);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
