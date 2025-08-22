import { ExecutionEnvironment } from "@/types/executor";
import { PageToHtmlTask } from "../task/PageToHtml";

export async function PageToHtmlExecutor(
    environment : ExecutionEnvironment<typeof PageToHtmlTask>
) : Promise<boolean> {
    try {
        const html = await environment.getPage()!.content();
        environment.log.info("Successfully received the HTML");
        environment.setOutput("HTML", html);
        return true;
    } catch (error : any) {
        environment.log.error(error.message);
        return false;
    }
};