import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appMask',
  standalone: true
})
export class MaskPipe implements PipeTransform {
  transform(value: string | null | undefined, type: 'name' | 'email' = 'name'): string {
    if (!value) return '';

    if (type === 'email') {
      const parts = value.split('@');
      if (parts.length !== 2) return value;
      const [local, domain] = parts;
      if (local.length <= 2) return `${local[0]}***@${domain}`;
      return `${local[0]}${local[1]}***${local[local.length - 1]}@${domain}`;
    }

    // Name masking: Jane Wilson -> J*** W*****
    const names = value.split(' ');
    const maskedNames = names.map(name => {
      if (name.length <= 1) return name;
      if (name.length === 2) return `${name[0]}*`;
      return name[0] + '*'.repeat(name.length - 1);
    });
    return maskedNames.join(' ');
  }
}
