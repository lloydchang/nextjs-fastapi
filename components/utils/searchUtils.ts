// File: components/utils/searchUtils.ts

import axios from 'axios';
import { AppDispatch } from 'store/store';
import { Talk } from 'types';
import { setError, setSelectedTalk } from 'store/talkSlice';
import { sendMessage } from 'store/chatSlice';
import { sdgTitleMap } from 'components/constants/sdgTitles';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to send the transcript of a talk
export const sendTranscriptForTalk = async (
  dispatch: AppDispatch,
  query: string,
  talk: Talk,
  lastDispatchedTalkId: React.MutableRefObject<string | null>,
  hasSentMessage: React.MutableRefObject<Set<string>>,
  retryCount = 0
): Promise<void> => {
  if (lastDispatchedTalkId.current === talk.title || hasSentMessage.current.has(talk.title)) {
    return;  // Avoid sending the same talk's transcript multiple times.
  }

  const sendTranscript = talk.transcript || 'Transcript not available';
  const sendSdgTag = talk.sdg_tags.length > 0 ? sdgTitleMap[talk.sdg_tags[0]] : '';

  try {
    await dispatch(sendMessage({ text: `${query} | ${talk.title} | ${sendTranscript} | ${sendSdgTag}`, hidden: true }));
    dispatch(setSelectedTalk(talk));  // Update selected talk
    lastDispatchedTalkId.current = talk.title;  // Mark this talk as dispatched
    hasSentMessage.current.add(talk.title);  // Track that this message has been sent
  } catch (dispatchError) {
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000;
      await wait(delay);
      await sendTranscriptForTalk(dispatch, query, talk, lastDispatchedTalkId, hasSentMessage, retryCount + 1);  // Retry sending if it fails
    } else {
      dispatch(setError(`Failed to send transcript for ${talk.title}.`));
    }
  }
};

// Function to send the first available transcript
export const sendFirstAvailableTranscript = async (
  dispatch: AppDispatch,
  query: string,
  talks: Talk[],
  lastDispatchedTalkId: React.MutableRefObject<string | null>,
  hasSentMessage: React.MutableRefObject<Set<string>>
): Promise<void> => {
  for (const talk of talks) {
    try {
      await sendTranscriptForTalk(dispatch, query, talk, lastDispatchedTalkId, hasSentMessage);
      return;  // Stop after the first successful send
    } catch (error) {
      console.error(`Failed to send transcript for talk: ${talk.title}. Error:`, error);
    }
  }
  dispatch(setError('Failed to send transcripts for all talks.'));
};

// Function to perform a search with exponential backoff
export const performSearchWithExponentialBackoff = async (
  query: string,
  maxRetries = 3
): Promise<Talk[] | null> => {
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await axios.get(`https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(query)}`);

      if (response.status !== 200) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      return response.data.results.map((result: any) => ({
        title: result.document.slug.replace(/_/g, ' '),
        url: `https://www.ted.com/talks/${result.document.slug}`,
        sdg_tags: result.document.sdg_tags || [],
        transcript: result.document.transcript || 'Transcript not available',
      }));
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        console.error(`Search failed after ${maxRetries} attempts.`);
        return null;
      }
      const delay = Math.pow(2, retryCount) * 1000;
      await wait(delay);
    }
  }

  return null;
};
