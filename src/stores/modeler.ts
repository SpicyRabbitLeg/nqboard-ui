import { defineStore } from 'pinia';

export const useModelerStore = defineStore('modeler', {
  state: () => ({
    userList: [] as any[],
    roleList: [] as any[],
    expList: [] as any[],
    modeler: null as any,
    modeling: null as any,
    moddle: null as any,
    canvas: null as any,
    bpmnFactory: null as any,
    elRegistry: null as any,
    element: null as any,
  }),
  actions: {
    setElement(el: any) {
      this.element = el;
    },
    reset() {
      this.modeler = null;
      this.modeling = null;
      this.moddle = null;
      this.canvas = null;
      this.bpmnFactory = null;
      this.elRegistry = null;
      this.element = null;
      this.userList = [];
      this.roleList = [];
      this.expList = [];
    },
  },
});