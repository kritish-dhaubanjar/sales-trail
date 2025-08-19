import { useState, useRef, useCallback, useLayoutEffect } from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { FormControl } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { CheckIcon, CaretSortIcon } from '@radix-ui/react-icons';

import { cn } from '@/lib/utils';

function Combobox({ index, products = {}, field, onSelect = () => {}, initOpen = false }) {
  const ref = useRef(null);
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(initOpen);

  const resetScroll = useCallback(() => {
    ref.current?.scroll({ top: 0 });
  }, [ref]);

  useLayoutEffect(resetScroll, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            autoFocus
            variant="outline"
            role="combobox"
            className={cn(
              'w-full justify-between border-none shadow-none focus:ring-0',
              !field.value && 'text-muted-foreground',
            )}
          >
            {field.value
              ? products.data.data.find(({ id }) => String(id) === String(field.value))?.name
              : 'Select Item'}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>

      <PopoverContent className="w-[328px] p-0">
        <Command>
          <CommandInput onValueChange={setValue} placeholder="Search item..." className="h-9" />
          <CommandList ref={ref}>
            <CommandEmpty>No Item found.</CommandEmpty>
            <CommandGroup>
              {products.data.data.map((product) => (
                <CommandItem
                  value={product.name}
                  key={product.id}
                  onSelect={() => {
                    onSelect(index, product);
                    setOpen(false);
                  }}
                >
                  {product.name}
                  <CheckIcon
                    className={cn(
                      'ml-auto h-4 w-4',
                      product.id === field.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default Combobox;
