import Joi from 'joi';
import {optionalUrl} from '../validators.js';

const queryParamSchema = Joi.object({
  disableStrictSSL: Joi.equal(''),
  jobUrl: optionalUrl,
}).required()

const buildRedirectUrl = ({ protocol, host, job }) => {
  const jobPrefix = job.indexOf('/') > -1 ? '' : 'job/'
  return `${protocol}://${host}/${jobPrefix}${job}`
}

const buildUrl = ({ jobUrl, lastCompletedBuild = true, plugin }) => {
  const lastCompletedBuildElement = lastCompletedBuild
    ? 'lastCompletedBuild/'
    : ''
  const pluginElement = plugin ? `${plugin}/` : ''
  return `${jobUrl}/${lastCompletedBuildElement}${pluginElement}api/json`
}

export {
  queryParamSchema,
  buildTreeParamQueryString: tree => ({ tree }),
  buildUrl,
  buildRedirectUrl,
};
