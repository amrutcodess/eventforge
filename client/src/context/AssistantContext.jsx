import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Lets the assistant know which event the visitor is currently looking at, and lets any page
 * hand the assistant a question to ask.
 *
 * The widget is mounted once in `App`, so it survives navigation and can hold a conversation
 * across pages — which is what you want from a support assistant, and the opposite of what you
 * get if each page owns its own. But it also means the widget cannot read `useParams`; it is not
 * inside the route. So `EventDetail` publishes the event it has already fetched, and the widget
 * consumes it.
 *
 * Publishing the id rather than the slug matters: the assistant's `eventId` is resolved against
 * the caller's real permissions server-side, so passing a slug would mean either an extra
 * lookup or trusting a client-supplied string that the server would have to re-validate anyway.
 *
 * `ask()` is the other direction. The landing page's AI section shows a real question and a
 * button; clicking it opens the widget with that question already sent. The alternative — a
 * screenshot of an answer — would be an invented transcript on the marketing page, and calling
 * the model on every page view just to fill the panel would spend the public rate budget on
 * visitors who never read it. A `nonce` rides along so the widget can tell a genuinely new
 * request from a re-render, since `send` is re-created whenever the conversation changes.
 */
const AssistantContext = createContext({
  event: null,
  setEvent: () => {},
  request: null,
  ask: () => {},
  clearRequest: () => {}
});

export const AssistantProvider = ({ children }) => {
  const [event, setEvent] = useState(null);
  const [request, setRequest] = useState(null);

  const ask = useCallback((question) => {
    const text = String(question || '').trim();
    if (!text) return;
    setRequest({ question: text, nonce: `${Date.now()}:${Math.random()}` });
  }, []);

  const clearRequest = useCallback(() => setRequest(null), []);

  const value = useMemo(
    () => ({ event, setEvent, request, ask, clearRequest }),
    [event, request, ask, clearRequest]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
};

export const useAssistantContext = () => useContext(AssistantContext);
