import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "lodash";
import * as faker from "faker";

import VirtualList from "./VirtualList";

export const MAX_PAGES = 100;
export const MAX_CARDS_PER_PAGE = 3;

const createDataSource = () =>
  _.map(
    _.range(1, MAX_PAGES),
    id =>
      ({
        id,
        cards: _.map(_.range(1, _.random(2, MAX_CARDS_PER_PAGE + 1)), () => ({
          id: _.uniqueId(),
          card: faker.helpers.createCard(),
          image: faker.image.avatar()
        }))
      } as any)
  );

const dataSource = createDataSource();

const rootElement = document.getElementById("root");
ReactDOM.render(
  <VirtualList
    items={dataSource}
  />,
  rootElement
);
