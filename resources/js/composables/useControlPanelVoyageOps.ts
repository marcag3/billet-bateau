import { useControlVoyageAdminOps } from './useControlVoyageAdminOps';

export function useControlPanelVoyageOps() {
    const ops = useControlVoyageAdminOps();

    return {
        startDeparture: ops.startDeparture,
        markArrival: ops.markArrival,
        addPassenger: ops.addPassenger,
        removePassenger: ops.removePassenger,
        cancelTrip: ops.cancelTrip,
    };
}
