import { ExecutionEnvironment } from "@/types/executor";
import { PageToHtmlTask } from "../task/PageToHtml";

export async function PageToHtmlExecutor(
    environment : ExecutionEnvironment<typeof PageToHtmlTask>
) : Promise<boolean> {
    try {
        const websiteURL = environment.getInput("Web Page");
        console.log("@@Website URL:", websiteURL);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};