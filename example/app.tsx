import * as React from 'react';
import {Component} from 'react';
import {GHCorner} from 'react-gh-corner';
import {AppWrapper} from './styled';
import {hideOthers} from "../src";

export interface AppState {

}

const repoUrl = 'https://github.com/zzarcon/';
export default class App extends Component <{}, AppState> {
  state: AppState = {}

  render() {
    return (
      <AppWrapper>
        <div>one
          <button id="b1">1</button>
        </div>
        <div>two
          <button id="b2">2</button>
          two
          <button id="b3">3</button>
        </div>
        <button id="b4">4</button>
        <GHCorner openInNewTab href={repoUrl}/>
        Example!
      </AppWrapper>
    )
  }
}

(window as any).hideOthers = hideOthers;