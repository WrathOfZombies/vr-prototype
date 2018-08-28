import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "lodash";
import * as faker from "faker";

import VirtualList from "./VirtualList";

export const MAX_PAGES = 50;
export const MAX_CARDS_PER_PAGE = 3;

const createDataSource = () =>
  _.map(
    _.range(1, MAX_PAGES),
    id =>
      ({
        key: `page-${_.uniqueId()}`,
        id,
        cards: _.map(_.range(1, _.random(2, MAX_CARDS_PER_PAGE + 1)), () => ({
          id: `card-${_.uniqueId()}`,
          card: faker.helpers.createCard(),
          image: faker.image.avatar()
        }))
      } as any)
  );

const dataSource = createDataSource();

const getPrevPage = currentPage => {
  if (!currentPage) {
    return Promise.resolve(dataSource[0]);
  } else {
    const id = currentPage.id - 1 || dataSource.length;
    return Promise.resolve(dataSource[id - 1]);
  }
};

const getNextPage = currentPage => {
  if (!currentPage) {
    return Promise.resolve(dataSource[1]);
  } else {
    const id = currentPage.id === dataSource.length ? 0 : currentPage.id;
    return Promise.resolve(dataSource[id]);
  }
};

const rootElement = document.getElementById("root");
ReactDOM.render(
  <VirtualList
    getPageAfter={getNextPage}
    getPageBefore={getPrevPage}
    settings={{
      debug: true,
      startBottomUp: true
    }}
  />,
  rootElement
);
