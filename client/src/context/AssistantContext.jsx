import React, { createContext, useContext, useMemo, useState } from 'react';

/**
 * Lets the assistant know which event the visitor is currently looking at.
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
 */
const AssistantContext = createContext({ event: null, setEvent: () => {} });

export const AssistantProvider = ({ children }) => {
  const [event, setEvent] = useState(null);
  const value = useMemo(() => ({ event, setEvent }), [event]);
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
};

export const useAssistantContext = () => useContext(AssistantContext);
