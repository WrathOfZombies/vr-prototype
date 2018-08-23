import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "lodash";
import * as faker from "faker";
import { MAX_CARDS_PER_PAGE, MAX_PAGES } from "./settings";
import VirtualList from "./VirtualList";

const createDataSource = () =>
  _.map(
    _.range(1, MAX_PAGES),
    id =>
      ({
        id,
        cards: _.map(_.range(1, _.random(1, MAX_CARDS_PER_PAGE)), () => ({
          id: _.uniqueId(),
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
    return Promise.resolve(dataSource[0]);
  } else {
    const id = currentPage.id === dataSource.length ? 0 : currentPage.id;
    return Promise.resolve(dataSource[id]);
  }
};

const rootElement = document.getElementById("root");
ReactDOM.render(
  <VirtualList
    getNextPage={getNextPage}
    getPrevPage={getPrevPage}
    settings={{
      debug: false,
      startBottomUp: true
    }}
  />,
  rootElement
);
