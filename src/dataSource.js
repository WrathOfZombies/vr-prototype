import _ from "lodash"
import faker from "faker"
import { MAX_CARDS_PER_PAGE, MAX_PAGES } from "./settings"

const createDataSource = () =>
  _.map(_.range(1, MAX_PAGES), id => ({
    id: _.uniqueId(),
    cards: _.map(_.range(1, MAX_CARDS_PER_PAGE), id => ({
      id: _.uniqueId(),
      card: faker.helpers.createCard(),
      image: faker.image.avatar()
    }))
  }))

export default createDataSource
