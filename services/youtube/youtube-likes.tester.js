import Joi from 'joi';
const t = (function() {
  export default __a;
}())
import {noToken} from '../test-helpers.js';
import {isMetric} from '../test-validators.js';
import _noYouTubeToken from './youtube-likes.service';
const noYouTubeToken = noToken(_noYouTubeToken);

t.create('video like count')
  .skipWhen(noYouTubeToken)
  .get('/pU9Q6oiQNd0.json')
  .expectBadge({
    label: 'likes',
    message: isMetric,
    color: 'red',
    link: ['https://www.youtube.com/video/pU9Q6oiQNd0'],
  })

t.create('video vote count')
  .skipWhen(noYouTubeToken)
  .get('/pU9Q6oiQNd0.json?withDislikes')
  .expectBadge({
    label: 'likes',
    message: Joi.string().regex(
      /^([1-9][0-9]*[kMGTPEZY]?|[1-9]\.[1-9][kMGTPEZY]) 👍 ([1-9][0-9]*[kMGTPEZY]?|[1-9]\.[1-9][kMGTPEZY]) 👎$/
    ),
    color: 'red',
    link: ['https://www.youtube.com/video/pU9Q6oiQNd0'],
  })

t.create('video not found')
  .skipWhen(noYouTubeToken)
  .get('/doesnotexist.json?withDislikes')
  .expectBadge({
    label: 'youtube',
    message: 'video not found',
    color: 'red',
  })
