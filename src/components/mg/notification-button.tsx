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

// Example changelog data with content as an array of strings
const changelogs: {
  version: string;
  date: string;
  content: string[];
  hot: boolean;
}[] = [
  {
    version: "1.0.0",
    date: "2025-02-04",
    hot: true,
    content: ["🚀 Version 1.0.0 is officially live!!!"],
  },
];

function NotificationButton() {
  const LAST_UPDATE_TIME = new Date(changelogs[0].date);
  const { hasNew, markAsRead } = useNotificationStatus(LAST_UPDATE_TIME);

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
          <SheetTitle>Changelog</SheetTitle>
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
                  {log.content.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </SheetDescription>
        </SheetHeader>
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
      </SheetContent>
    </Sheet>
  );
}

export default NotificationButton;
