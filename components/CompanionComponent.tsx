'use client';

import { cn, configureAssistant } from '@/lib/utils'
import { appImages } from "@/constants/images";
import { vapi } from '@/lib/vapi.sdk';
import React, { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import soundwaves from '@/constants/soundwaves.json';
import { saveSession, startSessionDraft, checkpointSession, finalizeSession } from '@/lib/actions/companion.actions';

const CHECKPOINT_DEBOUNCE_MS = 3000;

enum CallStatus {
  INACTIVE = 'INACTIVE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

const CompanionComponent = ({ subject, companionId, topic, name, userName, userImage, style = 'casual', voice = 'female', systemPrompt, sessionLocale = 'en', canStartSession = true, ragContext = null }: CompanionComponentProps) => {
  
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const startedAtRef = useRef<string | null>(null);
  const hasSavedRef = useRef(false);
  const messagesRef = useRef<SavedMessage[]>([]);
  const draftSessionIdRef = useRef<string | null>(null);
  const draftSessionPromiseRef = useRef<Promise<string | null> | null>(null);
  const checkpointTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getChronologicalTranscript = useCallback(
    () => [...messagesRef.current].reverse(),
    []
  );

  const scheduleCheckpoint = useCallback(() => {
    const sessionId = draftSessionIdRef.current;
    if (!sessionId) return;

    if (checkpointTimerRef.current) {
      clearTimeout(checkpointTimerRef.current);
    }

    checkpointTimerRef.current = setTimeout(() => {
      void checkpointSession(sessionId, getChronologicalTranscript()).catch(
        (error) => console.error("Failed to checkpoint session", error)
      );
    }, CHECKPOINT_DEBOUNCE_MS);
  }, [getChronologicalTranscript]);

  const flushCheckpoint = useCallback(
    async (sessionId: string) => {
      if (checkpointTimerRef.current) {
        clearTimeout(checkpointTimerRef.current);
        checkpointTimerRef.current = null;
      }

      await checkpointSession(sessionId, getChronologicalTranscript());
    },
    [getChronologicalTranscript]
  );

  const sendBeaconCheckpoint = useCallback(
    (sessionId: string) => {
      const payload = JSON.stringify({
        transcript: getChronologicalTranscript(),
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(`/api/sessions/${sessionId}/checkpoint`, blob);
      }
    },
    [getChronologicalTranscript]
  );

  const appendMessage = useCallback((newMessage: SavedMessage) => {
    messagesRef.current = [newMessage, ...messagesRef.current];
    setMessages(messagesRef.current);
    scheduleCheckpoint();
  }, [scheduleCheckpoint]);

  const beginSessionDraft = useCallback(() => {
    draftSessionIdRef.current = null;
    draftSessionPromiseRef.current = startSessionDraft({
      companionId,
      companionName: name,
      companionTopic: topic,
      companionSubject: subject,
    })
      .then((draft) => {
        draftSessionIdRef.current = draft.id;
        return draft.id;
      })
      .catch((error) => {
        console.error("Failed to start session draft", error);
        return null;
      });
  }, [companionId, name, topic, subject]);

  const persistSession = useCallback(async () => {
    if (hasSavedRef.current) return;

    hasSavedRef.current = true;
    const endedAt = new Date().toISOString();
    const startedAt = startedAtRef.current ?? endedAt;
    const durationSeconds = Math.max(
      0,
      Math.round(
        (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
      )
    );

    const chronological = getChronologicalTranscript();
    let draftSessionId = draftSessionIdRef.current;
    if (!draftSessionId && draftSessionPromiseRef.current) {
      draftSessionId = await draftSessionPromiseRef.current;
    }

    const finalizePayload = {
      transcript: chronological,
      startedAt,
      endedAt,
      durationSeconds,
      companionName: name,
      companionTopic: topic,
      companionSubject: subject,
    };

    try {
      if (draftSessionId) {
        await flushCheckpoint(draftSessionId);
        const session = await finalizeSession(draftSessionId, finalizePayload);
        setSavedSessionId(session.id);
      } else {
        const session = await saveSession({
          companionId,
          ...finalizePayload,
        });
        setSavedSessionId(session.id);
      }
    } catch (error) {
      hasSavedRef.current = false;
      console.error('Failed to save session', error);
    }
  }, [companionId, name, topic, subject, getChronologicalTranscript, flushCheckpoint]);

  useEffect(() => {
    if (lottieRef) {
      if (isSpeaking) {
        lottieRef.current?.play()
      } else {
        lottieRef.current?.stop();
      }
    }
  }, [isSpeaking, lottieRef])

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
      startedAtRef.current = new Date().toISOString();
      hasSavedRef.current = false;
      setSavedSessionId(null);

      if (!draftSessionPromiseRef.current) {
        beginSessionDraft();
      }
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      // Defer so any final transcript event in the same tick updates messagesRef first
      queueMicrotask(() => void persistSession());
    };

    const onMessage = (message: Message) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        appendMessage({ role: message.role, content: message.transcript });
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: Error) => console.log('Error', error);

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('message', onMessage);
    vapi.on('error', onError);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);

    return () => {
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('message', onMessage);
      vapi.off('error', onError);
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
    }
  }, [persistSession, appendMessage, beginSessionDraft])

  useEffect(() => {
    const onPageHide = () => {
      const sessionId = draftSessionIdRef.current;
      if (!sessionId || hasSavedRef.current) return;
      sendBeaconCheckpoint(sessionId);
    };

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [sendBeaconCheckpoint]);

  useEffect(() => {
    return () => {
      if (checkpointTimerRef.current) {
        clearTimeout(checkpointTimerRef.current);
      }
    };
  }, []);

  const toggleMicrophone = () => {
    const muted = vapi.isMuted();
    vapi.setMuted(!muted);
    setIsMuted(!muted);
  }

  const handleCall = async () => {
    if (!canStartSession) return;

    setCallStatus(CallStatus.CONNECTING);
    setMessages([]);
    messagesRef.current = [];
    hasSavedRef.current = false;
    setSavedSessionId(null);
    draftSessionIdRef.current = null;
    draftSessionPromiseRef.current = null;

    if (checkpointTimerRef.current) {
      clearTimeout(checkpointTimerRef.current);
      checkpointTimerRef.current = null;
    }

    beginSessionDraft();

    const assistantOverrides = {
      variableValues: {
        subject, topic, style
      },
      clientMessages: ["transcript"],
      serverMessages: [],
    }

    // @ts-expect-error Vapi assistant override typing
    vapi.start(
      configureAssistant(voice, style, {
        subject,
        topic,
        systemPrompt,
        sessionLocale,
        ragContext,
      }),
      assistantOverrides
    )
  }

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
    await persistSession();
  }

  return (
    <section className="flex flex-col h-[70vh]">
        {callStatus === CallStatus.FINISHED && savedSessionId && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
            <p className="text-sm font-medium">Session saved successfully.</p>
            <Link href={`/sessions/${savedSessionId}`} className="btn-primary text-sm">
              View transcript
            </Link>
          </div>
        )}

        <section className="companion-session-row">
            <div className="companion-section">
                <div className={cn('absolute inset-0 transition-opacity duration-1000', 
                      callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100' : 'opacity-0', 
                      callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse')}>
                        <Image
                          src={appImages.robotTutorMain}
                          alt="AI Robot Tutor"
                          fill
                          priority
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover object-center"
                        />
                    </div>

                    <div className={cn('absolute inset-0 transition-opacity duration-1000', 
                      callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0')}>
                        <Lottie lottieRef={lottieRef} 
                          animationData={soundwaves} 
                          autoPlay={false}
                          className="companion-lottie"
                        />
                    </div>

                <div className="companion-section-footer">
                  <p className="font-bold text-2xl max-sm:text-lg text-white drop-shadow-sm">{name}</p>
                </div>
            </div>

            <div className="user-section">
                <div className="user-avatar">
                      <Image src={userImage} alt={userName} width={130} height={130} className="rounded-lg" />
                      <p className="font-bold text-2xl">
                        {userName}
                      </p>

                </div>
                <button 
                  type="button"
                  className={cn("btn-mic", 
                    callStatus !== CallStatus.ACTIVE && "opacity-50 cursor-not-allowed"
                  )} 
                  onClick={toggleMicrophone}
                  disabled={callStatus !== CallStatus.ACTIVE}
                >
                        <Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} alt="mic" width={36} height={36} />
                        <p className="max-sm:hidden">
                          {callStatus === CallStatus.ACTIVE 
                            ? (isMuted ? 'Turn on microphone' : 'Turn off microphone')
                            : 'Start session to use microphone'
                          }
                        </p>
                </button>
                <button type="button" className={cn('w-full shrink-0 cursor-pointer rounded-lg py-2.5 text-white transition-colors', 
                  callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary', 
                  callStatus === CallStatus.CONNECTING && 'animate-pulse',
                  !canStartSession && callStatus !== CallStatus.ACTIVE && 'opacity-50 cursor-not-allowed')} 
                  onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
                  disabled={!canStartSession && callStatus !== CallStatus.ACTIVE}
                >
                      {!canStartSession && callStatus !== CallStatus.ACTIVE
                        ? 'Monthly limit reached'
                        : callStatus === CallStatus.ACTIVE
                          ? 'End session'
                          : callStatus === CallStatus.CONNECTING
                            ? 'Connecting...'
                            : 'Start session'}
                </button>

            </div>
        </section>
        <section className="transcript">
            <div className="transcript-message no-scrollbar">
                  {messages.map((message, index) => {
                    if (message.role === "assistant") {
                      return (
                        <div
                          key={index}
                          className="transcript-bubble transcript-bubble-assistant max-w-4xl"
                        >
                          <span className="font-semibold text-primary">
                            {name.split(" ")[0]}:
                          </span>{" "}
                          {message.content}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`${message.content}-${index}`}
                        className="transcript-bubble transcript-bubble-user max-w-4xl ml-auto"
                      >
                        <span className="font-semibold">{userName}:</span>{" "}
                        {message.content}
                      </div>
                    );
                  })}
            </div>

            <div className="transcript-fade" />

        </section>
    </section>
  )
}

export default CompanionComponent
