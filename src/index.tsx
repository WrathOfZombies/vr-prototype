import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "lodash";
import * as faker from "faker";
import { MAX_CARDS_PER_PAGE, MAX_PAGES } from "./settings";
import VirtualList from "./VirtualList";

const createDataSource = () =>
  _.map(_.range(1, MAX_PAGES), id => ({
    id: _.uniqueId(),
    cards: _.map(_.range(1, _.random(0, MAX_CARDS_PER_PAGE, false)), id => ({
      id: _.uniqueId(),
      card: faker.helpers.createCard(),
      image: faker.image.avatar()
    }))
  }));

const dataSource = createDataSource();

const getPrevPage = currentPage => Promise.resolve(dataSource.pop());

const getNextPage = currentPage => Promise.resolve(dataSource.pop());

const rootElement = document.getElementById("root");
ReactDOM.render(
  <VirtualList getNextPage={getNextPage} getPrevPage={getPrevPage} />,
  rootElement
);
