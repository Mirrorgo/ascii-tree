import { Archive } from "lucide-react";
import { Button } from "../ui/button";
import useNotificationStatus from "@/hooks/use-notification-status";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { useTranslation } from "react-i18next";

const changelogs: {
  version: string;
  date: string;
  hot: boolean;
  content: {
    en: string[];
    zh: string[];
  };
}[] = [
  {
    version: "1.0.1",
    date: "2025-02-05",
    hot: false,
    content: {
      en: ["🌍 Now supporting both English and Chinese"],
      zh: ["🌍 现在支持中英双语啦~ 让↘我们说→中文！"],
    },
  },
  {
    version: "1.0.0",
    date: "2025-02-04",
    hot: true,
    content: {
      en: ["🚀 Version 1.0.0 is officially live!!!"],
      zh: ["🚀 版本 1.0.0 正式上线啦！！！"],
    },
  },
];

function NotificationButton() {
  const { t, i18n } = useTranslation();
  const LAST_UPDATE_TIME = new Date(changelogs[0].date);
  const { hasNew, markAsRead } = useNotificationStatus(LAST_UPDATE_TIME);
  const currentLanguage = i18n.language as "en" | "zh"; // 限制类型，确保 TS 识别

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" onClick={markAsRead}>
          <div className="relative">
            <Archive />
            {hasNew && (
              <span className="absolute top-0 right-0 h-1.5 w-1.5 bg-red-500 rounded-full translate-x-1/2 -translate-y-1/2" />
            )}
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("notification.changelogTitle")}</SheetTitle>
          <SheetDescription>
            {changelogs.map((log, index) => (
              <div key={index} className="mb-4">
                <div className="flex items-center">
                  <h1 className="text-base font-semibold">{log.version}</h1>
                  <div className="ml-2 scale-75 inline-flex px-2.5 py-0.5 text-xs font-semibold text-blue-600 bg-blue-200 rounded-md">
                    {log.date}
                  </div>
                </div>
                <ul className="list-disc pl-5 mt-2 text-left text-sm">
                  {log.content[currentLanguage].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </SheetDescription>
        </SheetHeader>
        {currentLanguage === "en" ? (
          <div className="mt-4 text-sm text-gray-600">
            Enjoying this project? Consider supporting it on{" "}
            <a
              href="https://github.com/Mirrorgo/ascii-tree/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              GitHub
            </a>{" "}
            so more people can discover it!
          </div>
        ) : (
          // 中文
          <div className="mt-4 text-sm text-gray-600">
            如果你喜欢这个项目，可以在{" "}
            <a
              href="https://github.com/Mirrorgo/ascii-tree/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              GitHub
            </a>{" "}
            上支持一下，非常感谢！
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default NotificationButton;
