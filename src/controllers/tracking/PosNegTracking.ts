import { DefaultSession, Session, TrackingType } from "@sajari/sdk-js";

import { Tracking } from "./Tracking";
import { getTrackingData } from "./utils";

export class PosNegTracking extends Tracking {
  /**
   * Construct a PosNegTracking instance.
   */
  constructor(field: string) {
    super();
    this.clientTracking = new DefaultSession(
      TrackingType.PosNeg,
      field,
      getTrackingData()
    );
  }

  /**
   * Reset the tracking.
   * @param values Key-value pair parameters to use in the pipeline.
   */
  public reset(values?: { [k: string]: string }) {
    (this.clientTracking as Session).reset();
    if (values !== undefined) {
      this._emitTrackingReset(values);
    }
  }

  /**
   * Construct a tracking session to be used in a search.
   * @param values Key-value pair parameters to use in the pipeline.
   */
  public next(values: { [k: string]: string }) {
    if (this.clientTracking === null) {
      throw new Error("clientTracking is null");
    }
    return this.clientTracking.next(values);
  }
}
