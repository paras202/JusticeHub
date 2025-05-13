"use client";

import { MediaRoom } from "@/components/video-call/media-room";


export default function VideoConferencePage() {
  // Using a dummy chatId for demonstration purposes
  const dummyChatId = "video-conference-demo-123";
  
  return (
    <div className="h-full">
      <MediaRoom
        chatId={dummyChatId}
        video={true}
        audio={true}
      />
    </div>
  );
}