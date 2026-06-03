import 'jest-preset-angular/setup-jest';

jest.mock('@lucide/angular', () => {
  const { Component, Input } = require('@angular/core');

  @Component({
    selector: 'lucide-dynamic-icon, lucide-icon, [lucideIcon], [lucide-icon]',
    template: '<ng-content></ng-content>',
    standalone: true
  })
  class MockLucideDynamicIcon {
    @Input() name: string = '';
    @Input() lucideIcon: string = '';
    @Input() size: number = 24;
  }

  return {
    LucideDynamicIcon: MockLucideDynamicIcon
  };
});
