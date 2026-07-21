import type { IdentifiedEntity } from '../../domain/types'
import { FieldRow, ListBlock, LabelValueGrid } from './fieldUi'

/** Surface the 2–3 most useful facet fields above the fold. */
export function HeroFields({ entity }: { entity: IdentifiedEntity }) {
  switch (entity.kind) {
    case 'food': {
      const f = entity.facets
      return (
        <div className="hero-fields">
          <FieldRow label="Contents" value={f.contents} />
          <FieldRow label="Origin" value={f.origin} />
          {f.allergens.length ? <ListBlock items={f.allergens} /> : null}
          {f.nutritionFacts.length ? (
            <LabelValueGrid rows={f.nutritionFacts.slice(0, 4)} />
          ) : null}
        </div>
      )
    }
    case 'alcohol': {
      const f = entity.facets
      return (
        <div className="hero-fields">
          <FieldRow
            label="ABV"
            value={f.abv != null ? `${f.abv}%` : null}
          />
          <FieldRow label="Style" value={f.style} />
          <FieldRow label="Region" value={f.region} />
        </div>
      )
    }
    case 'book': {
      const f = entity.facets
      return (
        <div className="hero-fields">
          {f.authors.length ? (
            <FieldRow label="Authors" value={f.authors.join(', ')} />
          ) : null}
          <FieldRow label="Year" value={f.year != null ? String(f.year) : null} />
          <FieldRow label="ISBN" value={f.isbn} />
        </div>
      )
    }
    case 'movie':
    case 'tv_show': {
      const f = entity.facets
      return (
        <div className="hero-fields">
          <FieldRow
            label="Year"
            value={f.year != null ? String(f.year) : null}
          />
          {'directors' in f && f.directors.length ? (
            <FieldRow label="Directors" value={f.directors.join(', ')} />
          ) : null}
          {'creators' in f && f.creators.length ? (
            <FieldRow label="Creators" value={f.creators.join(', ')} />
          ) : null}
          {f.genre.length ? (
            <FieldRow label="Genre" value={f.genre.join(', ')} />
          ) : null}
        </div>
      )
    }
    case 'animal':
    case 'pet': {
      const f = entity.facets
      return (
        <div className="hero-fields">
          <FieldRow label="Species" value={f.species} />
          {'breedEstimate' in f ? (
            <FieldRow label="Breed" value={f.breedEstimate} />
          ) : null}
          {'commonName' in f ? (
            <FieldRow label="Common name" value={f.commonName} />
          ) : null}
          {'conservationStatus' in f ? (
            <FieldRow label="Status" value={f.conservationStatus} />
          ) : null}
        </div>
      )
    }
    case 'plant': {
      const f = entity.facets
      return (
        <div className="hero-fields">
          <FieldRow label="Common name" value={f.commonName} />
          <FieldRow label="Scientific" value={f.scientificName} />
          <FieldRow label="Light" value={f.lightNeeds} />
        </div>
      )
    }
    case 'landmark': {
      const f = entity.facets
      return (
        <div className="hero-fields">
          <FieldRow label="Location" value={f.location} />
          <FieldRow label="Country" value={f.country} />
          <FieldRow label="Built" value={f.builtOrOpened} />
        </div>
      )
    }
    case 'automobile': {
      const f = entity.facets
      return (
        <div className="hero-fields">
          <FieldRow label="Make" value={f.make} />
          <FieldRow label="Model" value={f.model} />
          <FieldRow
            label="Year"
            value={f.year != null ? String(f.year) : null}
          />
        </div>
      )
    }
    case 'electronics': {
      const f = entity.facets
      return (
        <div className="hero-fields">
          <FieldRow label="Brand" value={f.brand} />
          <FieldRow label="Model" value={f.model} />
          <FieldRow label="Category" value={f.category} />
        </div>
      )
    }
    case 'person': {
      const f = entity.facets
      return (
        <div className="hero-fields">
          <FieldRow label="Occupation" value={f.occupation} />
          {f.knownFor.length ? (
            <FieldRow label="Known for" value={f.knownFor.slice(0, 3).join(', ')} />
          ) : null}
        </div>
      )
    }
    case 'artwork': {
      const f = entity.facets
      return (
        <div className="hero-fields">
          <FieldRow label="Artist" value={f.artist} />
          <FieldRow label="Medium" value={f.medium} />
          <FieldRow label="Year" value={f.year} />
        </div>
      )
    }
    default:
      return null
  }
}
