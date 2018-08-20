import _ from "lodash"
import faker from "faker"

const createDataSource = () =>
  _.map(_.range(1, 200), id => ({
    id: _.uniqueId(),
    cards: _.map(_.range(1, 6), id => ({
      id: _.uniqueId(),
      card: faker.helpers.createCard(),
      image: faker.image.avatar()
    }))
  }))

export default createDataSource
