// File: components/organisms/TalkItem.tsx

import React from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedTalk } from 'store/talkSlice';
import { Talk } from 'types';
import { sdgTitleMap } from 'components/constants/sdgTitles';
import styles from 'styles/components/organisms/TalkItem.module.css';

interface TalkItemProps {
  talk: Talk;
}

const TalkItem: React.FC<TalkItemProps> = ({ talk }) => {
  const dispatch = useDispatch();

  const handleClick = () => {
    dispatch(setSelectedTalk(talk));
  };

  return (
    <div className={styles.resultItem} onClick={handleClick}>
      <h3>
        <a href="#" className={styles.resultLink}>{talk.title}</a>
        <p className={styles.sdgTags}>{talk.sdg_tags.map(tag => sdgTitleMap[tag]).join(', ')}</p>
      </h3>
    </div>
  );
};

export default React.memo(TalkItem);
