// File: components/utils/apiUtils.ts

import axios from 'axios';
import { setTalks, setSelectedTalk, addSearchHistory } from 'store/talkSlice';
import { setLoading, setApiError, clearApiError } from 'store/apiSlice';
import { AppDispatch } from 'store/store';
import { debounce } from 'lodash';

/**
 * Performs a search for talks using the provided query.
 * This function is called from the TalkPanel component.
 */
export const performSearch = (query: string, signal?: AbortSignal) => async (dispatch: AppDispatch) => {
  dispatch(setLoading(true));
  dispatch(clearApiError());

  try {
    const response = await axios.get(
      `https://fastapi-search.vercel.app/api/search?query=${encodeURIComponent(query)}`,
      { signal }
    );

    if (response.status !== 200) throw new Error(response.statusText);

    const data = response.data.results.map((result: any) => ({
      title: result.document.slug.replace(/_/g, ' '),
      url: `https://www.ted.com/talks/${result.document.slug}`,
      sdg_tags: result.document.sdg_tags || [],
      transcript: result.document.transcript || 'Transcript not available',
    }));

    console.log('Search results:', data);

    dispatch(setTalks(data));
    dispatch(addSearchHistory(query));

    if (data.length > 0) {
      dispatch(setSelectedTalk(data[0]));
    }
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Search aborted: CanceledError');
    } else {
      console.error('Error during search:', error);
      dispatch(setApiError('Error fetching talks.'));
    }
  } finally {
    dispatch(setLoading(false));
  }
};

export const debouncedPerformSearch = debounce(
  (query: string, dispatch: AppDispatch, signal: AbortSignal) => {
    dispatch(performSearch(query, signal));
  },
  500
);
