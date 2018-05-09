import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  Input
} from '@angular/core';


@Component({
  selector: 'qm-list-item',
  templateUrl: './qm-list-item.component.html',
  styleUrls: ['./qm-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QmListItemComponent implements OnInit {
  @Input()
  isSelected = false;

  @Input()
  centerText = false;

  @Input()
  inputType: string;

  @Input()
  name: string;

  @Input()
  title = '';

  @Output()
  optionClicked = new EventEmitter();

  constructor() { }

  ngOnInit() {

  }

  handleClick($event) {
    this.optionClicked.emit($event);
  }
}

