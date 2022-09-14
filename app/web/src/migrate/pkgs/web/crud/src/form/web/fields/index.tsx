import { WBelongsTo } from './WBelongsTo'
import { WBoolean } from './WBoolean'
import { WDate } from './WDate'
import { WDateTime } from './WDateTime'
import { WFileUpload } from './WFileUpload'
import { WInfo } from './Winfo'
import { WSection } from './WSection'
import { WSelect } from './WSelect'
import { WText } from './WText'
import { WUnknown } from './WUnknown'
export default {
  number: WText,
  string: WText,
  text: WText,
  password: WText,
  money: WText,
  multiline: WText,
  date: WDate,
  datetime: WDateTime,
  select: WSelect,
  boolean: WBoolean,
  'belongs-to': WBelongsTo,
  unknown: WUnknown,
  info: WInfo,
  section: WSection,
  decimal: WText,
  file: WFileUpload,
}
