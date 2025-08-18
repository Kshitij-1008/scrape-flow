import { waitFor } from "@/lib/helper/waitFor";
import { ExecutionEnvironment } from "@/types/executor";
import puppeteer from "puppeteer";
import { LaunchBrowserTask } from "../task/LaunchBrowser";

export async function LaunchBrowserExecutor(
    environment : ExecutionEnvironment<typeof LaunchBrowserTask>
) : Promise<boolean> {
    try {
        const websiteURL = environment.getInput("Website URL");
        console.log("@@Website URL:", websiteURL);
        const browser = await puppeteer.launch({
            headless: false,
        }) // Opens a visible browser: for testing; generally however, runs in background

        await waitFor(3000);
        await browser.close();
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};