import {Component} from '@angular/core';

@Component({
    template: `
    <h1>Not found</h1>
    The page you're looking for was not found.
    <br/>
    <a routerLink="/">Goto main page</a>
    `
})
export class PageNotFoundComponent {}