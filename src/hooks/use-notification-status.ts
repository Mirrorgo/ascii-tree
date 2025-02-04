import { useEffect, useState } from "react";

const storageItem = "notificationLastClicked";

function useNotificationStatus(lastUpdateTime: Date) {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const storedTime = localStorage.getItem(storageItem);
    if (!storedTime) {
      setHasNew(true);
    } else {
      const lastClicked = new Date(storedTime);
      setHasNew(lastClicked < lastUpdateTime);
    }
  }, [lastUpdateTime]);

  const markAsRead = () => {
    const now = new Date();
    localStorage.setItem(storageItem, now.toISOString());
    setHasNew(false);
  };

  return { hasNew, markAsRead };
}

export default useNotificationStatus;
