interface SessionTranscriptProps {
  messages: SavedMessage[];
  companionName: string;
  userName: string;
}

const SessionTranscript = ({
  messages,
  companionName,
  userName,
}: SessionTranscriptProps) => {
  if (messages.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No transcript was recorded for this session.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map((message, index) => {
        if (message.role === "assistant") {
          return (
            <div
              key={index}
              className="transcript-bubble transcript-bubble-assistant max-w-4xl"
            >
              <span className="font-semibold text-primary">
                {companionName.split(" ")[0]}:
              </span>{" "}
              {message.content}
            </div>
          );
        }

        if (message.role === "user") {
          return (
            <div
              key={index}
              className="transcript-bubble transcript-bubble-user max-w-4xl ml-auto"
            >
              <span className="font-semibold">{userName}:</span>{" "}
              {message.content}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default SessionTranscript;
