import * as Sajari from 'sajari'

import './polyfill' // for .startsWith

const TRACKING_RESET = 'TRACKING_RESET';
const RESULT_CLICKED = 'RESULT_CLICKED';
const RESULTS_CHANGED = 'RESULTS_CHANGED';
const VALUES_CHANGED = 'VALUES_CHANGED';

class state {
  constructor(namespace) {
    this.namespace = namespace;
    this.values = {};
    this.tracking = {};

    this.listeners = [];
  }

  getPipeline() {
    return this.pipeline;
  }

  getNamespace() {
    return this.namespace;
  }

  setPipeline(pipeline) {
    this.pipeline = pipeline;
  }

  setProject(project) {
    this.project = project;
  }

  setCollection(collection) {
    this.collection = collection;
  }

  setTrackingData(data) {
    this.tracking.data = data;
  }

  resetTracking() {
    this.tracking.seq = null;
    this.tracking.qid = null;
    this.notify(TRACKING_RESET);
  }

  reset() {
    this.results = undefined;
    this.notify(RESULTS_CHANGED);
    this.resetTracking();
  }

  // beforeSearch is run before a search is started (i.e. sent to the server).
  // If it returns false, then we bail.
  beforeSearch() {
    // If q == "" then clear the results immediately and don't run a search.
    if (this.values["q"] === "") {
      this.reset()
      delete this.values["filter"];
      delete this.values["page"];
      return false;
    }
    return true
  }

  _runSearch() {
    if (!this.beforeSearch()) {
      return
    }

    const client = new Sajari.Client(this.project, this.collection);
    const tracking = new Sajari.Tracking()

    if (this.pipeline === 'website') {
      tracking.clickTokens('url') // NOTE: this will not be cleared if the pipeline is changed
    }

    // tracking.data is merged into tracking.data (to avoid clearing existing values unless
    // another explicitly replaces it).
    if (this.tracking.data) {
      for (let k in this.tracking.data) {
        tracking.data[k] = this.tracking.data[k];
      }
    }

    // Record the QID and the sequence
    if (this.tracking.qid && this.tracking.seq >= 0) {
      tracking.i = this.tracking.qid;
      tracking.s = this.tracking.seq+1;
    }
    this.tracking.qid = tracking.i;
    this.tracking.seq = tracking.s;

    client.searchPipeline(this.pipeline, this.values, tracking, (err, res) => {
      // Discard this result if another (more recent query) has been sent through
      // with a different qid.
      if (this.tracking.qid !== tracking.i) {
        return;
      }

      // Discard this result if another (more recent query) has been sent.
      if (this.tracking.seq >= tracking.s) {
        return;
      }

      if (!res) {
        this.error = err || "No response.";
        if (console && console.error) {
          console.error("got error during search", this.error);
        }
        this.notify(RESULTS_CHANGED);
        return;
      }
      this.error = null;

      if (res.values) {
        // TODO: Move this out into a method.
        // This stuff is specific to autocomplete only.
        let values = this.getValues();
        if (res.values["q"] && res.values["q"] !== values["q"]) {
          res.values["q.used"] = res.values["q"];
          delete res.values["q"];
        } else {
          res.values["q.used"] = null;
        }
        this.setValues(res.values, false);
      }
      this.results = res.searchResponse;
      this.notify(RESULTS_CHANGED);
    })
  }

  registerListener(type, listener) {
    this.listeners.push({ type, listener })
  }

  unregisterListener(type, listener) {
    this.listeners = this.listeners.filter(l => {
      if (l.type === type && l.listener === listener) {
        return false;
      }
      return true;
    });
  }

  notify(type, ...x) {
    this.listeners.forEach(l => {
      if (l.type === type) {
        l.listener(...x);
      }
    })
  }

  getStatus() {
    return this.status;
  }

  getError() {
    return this.error;
  }

  getResults() {
    return this.results;
  }

  getValues() {
    return this.values;
  }

  beforeMergingValues(values) {
    // Only if values["q"] is set do we check if the value has changed.
    if (values["q"] !== undefined) {
      let prevQ = this.values["q"] || "";
      let currQ = values["q"];

      // Reset the tracking if the new query differs in prefix to the old.
      if (!currQ.startsWith(prevQ.substr(0, Math.min(currQ.length, 3)))) {
        this.resetTracking();
      }

      // If the query has changed then reset the page, but only if
      // we're not already trying to set it.
      if (currQ !== prevQ && values["page"] === undefined) {
        this.values["page"] = "1";
      }

      // Clear q.used when setting q to be "", but only if we're
      // not also setting q.used.
      if (currQ === "" && values["q.used"] === undefined) {
        delete this.values["q.used"];
      }
    }

    // Only if values["filter"] is set do we check if the value has changed.
    if (values["filter"] !== undefined) {
      let prevFilter = this.values["filter"] || "";
      // Reset the page, but only if we're not already trying
      // to set it.
      if (prevFilter !== values["filter"] && values["page"] === undefined) {
        this.values["page"] = "1";
      }
    }
  }

  setValues(values, runSearch = false) {
    this.beforeMergingValues(values);

    // Merge values into this.values.
    for (let k in values) {
      this.values[k] = values[k]
    }

    if (runSearch) {
      this._runSearch();
    }
    this.notify(VALUES_CHANGED);
  }
}

class State {
  constructor() {
    this._ns = {}

    this.ns = this.ns.bind(this);
  }

  default() {
    return this.ns("default");
  }

  ns(namespace) {
    let n = this._ns[namespace]
    if (!n) {
      n = new state(namespace);
      this._ns[namespace] = n
    }
    return n;
  }
}

const _state = new State();

export { _state as State, TRACKING_RESET, RESULT_CLICKED, RESULTS_CHANGED, VALUES_CHANGED }
